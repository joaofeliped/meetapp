import * as Yup from 'yup';
import { isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import User from '../models/User';
import File from '../models/File';

class MeetupController {
  async index(req, res) {
    const { page = 1, date } = req.query;

    if(!date) {
      return res.status(400).json({ error: 'Invalid date' });
    }

    const  parsedDate  = parseISO(date);

    const meetups = await Meetup.findAll({
      where: {
        date_hour: {
          [Op.between]: [
            startOfDay(parsedDate),
            endOfDay(parsedDate),
          ]
        }
      },
      attributes: ['id', 'title', 'description', 'localization', 'date_hour'],
      limit: 10,
      offset: (page - 1) * 10,
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name'],
        },
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'path', 'url']
        }
      ]
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required().min(10),
      localization: Yup.string().required(),
      date_hour: Yup.date().required(),
      banner_id: Yup.number().required(),
    });

    if(!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validations fails'});
    }

    const { title, description, localization, date_hour, banner_id } = req.body;

    const hourStart = date_hour;

    if(isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not allowed '});
    }

    const user_id = req.userId;

    const meetup = await Meetup.create({
      title,
      description,
      localization,
      date_hour,
      user_id,
      banner_id,
    });


    return res.json(meetup);
  }

  async update(req, res) {
    const meetup = await Meetup.findByPk(
      req.params.id, {
        include: [
          {
            model: User,
            as: 'organizer',
            attributes: ['id']
          }
        ]
      }
    );

    if(!meetup) {
      return res.status(400).json({ error: 'Meetup not found'});
    }

    if(req.userId !== meetup.organizer.id) {
      return res.status(401).json({ error: 'Only the organizer can update the meetup'});
    }

    if(isBefore(meetup.date_hour, new Date())) {
      return res.status(401).json({ error: 'Can\'t update past meetups'});
    }

    if(req.body.date_hour && isBefore(req.body.date_hour, new Date())) {
      return res.status(401).json({ error: 'Past dates are not allowed'});
    }

    if(req.body.user_id) {
      const newUser = await User.findByPk(req.body.user_id);

      if(!newUser) {
        return res.status(400).json({ error: 'User not found'});
      }
    }

    const meetupUpdated = await meetup.update(req.body);

    return res.json(meetupUpdated);
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(
      req.params.id, {
        include: [
          {
            model: User,
            as: 'organizer',
            attributes: ['id']
          }
        ]
      }
    );

    if(!meetup) {
      return res.status(400).json({ error: 'Meetup not found'});
    }

    if(req.userId !== meetup.organizer.id) {
      return res.status(401).json({ error: 'Only the organizer can delete the meetup'});
    }

    if(isBefore(meetup.date_hour, new Date())) {
      return res.status(401).json({ error: 'Can\'t delete past meetups'});
    }

    await Meetup.destroy({
      where: {
        id: meetup.id
      }
    });

    return res.json();
  }
}

export default new MeetupController();
